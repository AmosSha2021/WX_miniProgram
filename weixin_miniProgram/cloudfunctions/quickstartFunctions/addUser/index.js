const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const db = cloud.database()
  const _ = db.command
  const { userData } = event
  
  try {
    // 检查工号是否已存在
    const existCheck = await db.collection('user_info')
      .where({
        employeeID: userData.employeeID
      })
      .count()

    if (existCheck.total > 0) {
      return { code: 4001, message: '工号已被注册' }
    }

    // 插入新用户数据
    const res = await db.collection('user_info').add({
      data: {
        ...userData,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        isActive: true
      }
    })

    return {
      code: 200,
      message: '注册成功',
      data: { _id: res._id }
    }

  } catch (e) {
    console.error('云函数异常:', e)
    return { 
      code: 500, 
      message: '服务暂时不可用，请稍后重试',
      error: e 
    }
  }
}