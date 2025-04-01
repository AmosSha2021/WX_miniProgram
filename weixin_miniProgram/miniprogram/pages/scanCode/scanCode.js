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
      selectedGroup: this.data.groups[e.detail.value],
      allRecords: [], // 清空存储所有打卡记录
      currentEmployee: null // 清空当前扫描的运动员
    });
  },

  bindStationChange(e) {
    this.setData({
      selectedStation: this.data.stations[e.detail.value],
      allRecords: [], // 清空存储所有打卡记录
      currentEmployee: null // 清空当前扫描的运动员
    });
  },

  async handleScanCode() {
    const { selectedGroup, selectedStation } = this.data;
    
    if (!selectedGroup || !selectedStation) {
      return wx.showToast({ 
        title: '请先选择小组和站点', 
        icon: 'none' 
      });
    }

    this.setData({ scanLoading: true });

    try {
      const { result: employeeID } = await wx.scanCode({ onlyFromCamera: true });
      const db = wx.cloud.database();
      const _ = db.command;
      const currentTime = new Date();
      const currentIndex = this.data.stations.indexOf(selectedStation);

      // 核心业务流程
      const employeeData = await this.getEmployeeInfo(employeeID);
      await this.validateCheckpointRules(employeeID, selectedGroup, currentIndex, currentTime);
      await this.createCheckpointRecord({
        employeeID,
        group: selectedGroup,
        stationIndex: currentIndex,
        currentTime,
        nextStation: this.getNextStation(currentIndex),
        employeeData
      });
      
      // 更新界面数据
      await this.updatePostScanData(employeeID, employeeData);
      wx.showToast({ title: '打卡成功' });
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

  // 新增工具方法 -------------------------------------------------
  async getEmployeeInfo(employeeID) {
    const res = await wx.cloud.database().collection('employees').doc(employeeID).get();
    if (!res.data) throw new Error('未找到该运动员信息');
    return res.data;
  },

  async validateCheckpointRules(employeeID, group, currentIndex, currentTime) {
    if (currentIndex > 0) {
      await this.validatePreviousCheckpoints(employeeID, group, currentIndex);
      await this.autoCheckoutPrevious(employeeID, group, currentIndex, currentTime);
    }
    await this.checkCurrentCheckpoint(employeeID, group, currentIndex);
  },

  async validatePreviousCheckpoints(employeeID, group, currentIndex) {
    const db = wx.cloud.database();
    for (let i = 0; i < currentIndex; i++) {
      const records = await db.collection('checkpoints')
        .where({ employeeID, groupID: group, stationIndex: i })
        .get();
      if (records.data.length === 0) {
        throw new Error(`请先完成[${this.data.stations[i]}]打卡`);
      }
    }
  },

  async autoCheckoutPrevious(employeeID, group, currentIndex, currentTime) {
    const db = wx.cloud.database();
    const prevIndex = currentIndex - 1;
    const prevRecords = await db.collection('checkpoints')
      .where({ 
        employeeID,
        groupID: group,
        stationIndex: prevIndex,
        checkoutTime: db.command.eq(null)
      })
      .get();

    if (prevRecords.data.length > 0) {
      const record = prevRecords.data[0];
      await db.collection('checkpoints').doc(record._id).update({
        data: {
          checkoutTime: currentTime,
          timeCost: (currentTime - record.checkinTime) / 1000,
          nextStation: this.data.stations[currentIndex]
        }
      });
    }
  },

  async checkCurrentCheckpoint(employeeID, group, currentIndex) {
    const currentStation = this.data.stations[currentIndex];
    const records = await wx.cloud.database().collection('checkpoints')
      .where({
        employeeID,
        groupID: group,
        currentStation,
        $or: [
          { checkinTime: wx.cloud.database().command.neq(null) },
          { checkoutTime: wx.cloud.database().command.neq(null) }
        ]
      })
      .get();

    if (records.data.length > 0) {
      throw new Error(`您已经完成${currentStation}打卡`);
    }
  },

  getNextStation(currentIndex) {
    return currentIndex < this.data.stations.length - 1 
      ? this.data.stations[currentIndex + 1] 
      : null;
  },

  async createCheckpointRecord(params) {
    const { employeeID, group, stationIndex, currentTime, nextStation, employeeData } = params;
    await wx.cloud.database().collection('checkpoints').add({
      data: {
        _id: `${employeeID}_${stationIndex}_${Date.now()}`,
        employeeID,
        groupID: group,
        currentStation: this.data.stations[stationIndex],
        stationIndex,
        checkinTime: currentTime,
        checkoutTime: stationIndex === this.data.stations.length - 1 ? currentTime : null,
        nextStation,
        timeCost: 0,
        employeeName: employeeData.name,
        createdAt: wx.cloud.database().serverDate()
      }
    });
  },

  async updatePostScanData(employeeID, employeeData) {
    this.setData({ currentEmployee: employeeData });
    await Promise.all([
      //this.calculateRankings(),
      this.queryAllRecords(employeeID)
    ]);
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
