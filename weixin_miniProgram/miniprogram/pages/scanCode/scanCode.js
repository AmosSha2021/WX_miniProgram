Page({
  data: {
    stations: ['起点', '补给站1', '补给站2', '终点'],
    groups: ['A组', 'B组', 'C组', 'D组'],
    selectedStation: null,
    selectedGroup: null,
    scanLoading: false,
    rankings: [],
    showRanking: false,
    queryResult: null,
    allRecords: [], // 新增：存储所有打卡记录
    currentEmployee: null // 新增：当前扫描的运动员
  },

  bindGroupChange(e) {
    this.setData({
      selectedGroup: this.data.groups[e.detail.value]
    });
  },

  bindStationChange(e) {
    this.setData({
      selectedStation: this.data.stations[e.detail.value]
    });
  },

  async handleScanCode() {
    const { selectedGroup, selectedStation } = this.data;
    
    if (!selectedGroup || !selectedStation) {
      return wx.showToast({ 
        title: '请先选择小组和站点', 
        icon: 'none' 
      })
    }

    this.setData({ scanLoading: true });

    try {
      const scanResult = await wx.scanCode({ onlyFromCamera: true });
      const employeeID = scanResult.result;
      const db = wx.cloud.database();
      const _ = db.command;
      let currentTime = new Date();
      const currentIndex = this.data.stations.indexOf(selectedStation);

      // 获取运动员基本信息
      const employeeRes = await db.collection('employees').doc(employeeID).get();
      if (!employeeRes.data) {
        throw new Error('未找到该运动员信息');
      }

      // 严格顺序检查（新增逻辑）
      if (currentIndex > 0) {
        // 检查前面所有站点是否已完成
        for (let i = 0; i < currentIndex; i++) {
          const stationCheck = await db.collection('checkpoints')
            .where({
              employeeID,
              groupID: selectedGroup,
              stationIndex: i
            })
            .get();
          
          if (stationCheck.data.length === 0) {
            throw new Error(`请先完成${this.data.stations[i]}打卡`);
          }
        }

        // 获取上一站记录
        const prevStationIndex = currentIndex - 1;
        const prevStationCheck = await db.collection('checkpoints')
          .where({
            employeeID,
            groupID: selectedGroup,
            stationIndex: prevStationIndex,
            checkoutTime: _.eq(null)
          })
          .get();

        if (prevStationCheck.data.length > 0) {
          const prevRecord = prevStationCheck.data[0];
          // 自动完成上一站checkout
          await db.collection('checkpoints')
            .doc(prevRecord._id)
            .update({
              data: {
                checkoutTime: currentTime,
                timeCost: (currentTime - prevRecord.checkinTime) / 1000,
                nextStation: selectedStation
              }
            });
        }
      }

      // 检查当前站点是否已存在记录（新增严格检查）
      const stationCheck = await db.collection('checkpoints')
        .where({
          employeeID,
          groupID: selectedGroup,
          currentStation: selectedStation,
          $or: [
            { checkinTime: _.neq(null) },
            { checkoutTime: _.neq(null) }
          ]
        })
        .get();

      if (stationCheck.data.length > 0) {
        throw new Error(`您已经完成${selectedStation}打卡`);
      }

      // 获取最新打卡记录
      const latestRecord = await db.collection('checkpoints')
        .where({ employeeID, groupID: selectedGroup })
        .orderBy('checkinTime', 'desc')
        .limit(1)
        .get();

      // 计算下一站
      const nextStation = currentIndex < this.data.stations.length - 1 
        ? this.data.stations[currentIndex + 1] 
        : null;

      // 创建或更新记录
      if (latestRecord.data.length > 0 && currentIndex > 0) {
        const lastRecord = latestRecord.data[0];
        const timeCost = (currentTime - lastRecord.checkinTime) / 1000;
        
        // 更新上一站记录
        await db.collection('checkpoints')
          .doc(lastRecord._id)
          .update({
            data: {
              checkoutTime: currentTime,
              timeCost: timeCost,
              nextStation: selectedStation
            }
          });
      }

      // 创建当前站记录
      await db.collection('checkpoints').add({
        data: {
          _id: `${employeeID}_${currentIndex}_${Date.now()}`, // 添加时间戳确保唯一性
          employeeID,
          groupID: selectedGroup,
          currentStation: selectedStation,
          stationIndex: currentIndex,
          checkinTime: currentTime,
          checkoutTime: selectedStation === '终点' ? currentTime : null,
          nextStation: nextStation,
          timeCost: 0,
          employeeName: employeeRes.data.name,
          createdAt: db.serverDate() // 添加创建时间
        }
      });

      await this.calculateRankings();
      wx.showToast({ title: '打卡成功' });
      
      // 获取运动员信息并存储
      this.setData({ currentEmployee: employeeRes.data });
      // 新增查询最新记录功能
      //await this.queryLatestRecord(employeeID);
      // 打卡成功后查询所有记录
      await this.queryAllRecords(employeeID);
    } catch (err) {
      wx.showModal({
        title: '操作失败',
        content: err.message,
        showCancel: false
      });
    } finally {
      this.setData({ scanLoading: false });
    }
},

// 新增查询最新记录函数
async queryLatestRecord(employeeID) {
  const db = wx.cloud.database();
  const res = await db.collection('checkpoints')
    .where({
      employeeID: employeeID,
      groupID: this.data.selectedGroup,
      currentStation: this.data.selectedStation
    })
    .orderBy('checkinTime', 'desc')
    .get();  // 移除limit(1)以获取所有记录
  
  if (res.data.length > 0) {
    this.setData({
      queryRecords: res.data.map(record => ({
        employeeID: record.employeeID,
        employeeName: record.employeeName,
        checkinTime: this.formatTime(record.checkinTime),
        checkoutTime: record.checkoutTime ? this.formatTime(record.checkoutTime) : '尚未离开',
        timeCost: record.timeCost || '--'
      }))
    });
  } else {
    this.setData({ queryRecords: [] });
    wx.showToast({
      title: '未找到打卡记录',
      icon: 'none'
    });
  }
},

// 新增：查询所有打卡记录
async queryAllRecords(employeeID) {
  const res = await wx.cloud.database().collection('checkpoints')
    .where({ 
      employeeID,
      groupID: this.data.selectedGroup 
    })
    .orderBy('checkinTime', 'asc')
    .get();

  this.setData({
    allRecords: res.data.map(item => ({
      station: item.currentStation,
      checkin: this.formatTime(item.checkinTime),
      checkout: item.checkoutTime ? this.formatTime(item.checkoutTime) : '进行中',
      duration: this.formatDuration(item.timeCost)  // 使用新方法格式化时长
    }))
  });
},
  async calculateRankings() {
    const db = wx.cloud.database();
    const _ = db.command;
    
    const res = await db.collection('checkpoints')
      .where({ 
        groupID: this.data.selectedGroup,
        checkoutTime: _.neq(null) 
      })
      .orderBy('checkoutTime', 'asc')
      .get();

    const rankings = res.data.map(item => ({
      employeeID: item.employeeID,
      name: item.employeeName,
      time: this.formatTime(item.checkoutTime),
      station: item.currentStation
    }));

    this.setData({ 
      rankings,
      showRanking: rankings.length > 0
    });
  },

  formatTime(timestamp) {
    if (!timestamp) return '尚未离开';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs}秒`;
  },
});
