const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const db = cloud.database()
  const { employeeID, password } = event

  try {
    const { data } = await db.collection('user_info')
      .where({
        employeeID: employeeID,
        password: password
      })
      .get()

    if (data.length === 0) {
      return { code: 4002, message: '工号或密码错误' }
    }

    return {
      code: 200,
      message: '登录成功',
      data: data[0]
    }

  } catch (e) {
    console.error('登录云函数异常:', e)
    return { code: 500, message: '服务暂时不可用' }
  }
}