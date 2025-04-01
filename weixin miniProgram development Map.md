# 微信小程序开发Map---户外活动打卡

## 功能作用

主要用于记录公司员工参与户外活动的定点打卡的数据统计

- 打卡站点必须按照预定顺序进行（不可跳站）

- 支持手机扫描二维码（员工工号信息）

  

## 程序框架&技术选型

![image-20250401173238879](C:\Users\shahao\AppData\Roaming\Typora\typora-user-images\image-20250401173238879.png)

## 模块功能

- 打卡逻辑关键点说明

  1. 前置验证：必须选择站点/小组才能继续
  2. 核心校验：包含前序站点校验 → 自动签出 → 当前站点校验三步
  3. 数据操作：成功后同时更新本地数据和云数据库
  4. 异常处理：所有错误都会进入统一错误提示处理
  5. 状态管理：使用scan Loading控制按钮状态

  ```mermaid
  graph TD
      A[开始扫码处理] --> B{站点/小组已选?}
      B -->|否| C[显示提示并返回]
      B -->|是| D[设置scanLoading为true]
      D --> E[调用wx.scanCode扫码]
      E --> F{扫码成功?}
      F -->|失败| G[进入finally块]
      F -->|成功| H[获取employeeID]
      H --> I[获取员工信息]
      I --> J{员工存在?}
      J -->|否| K[抛出错误]
      J -->|是| L[验证打卡规则]
      L --> M{前序站点未完成?}
      M -->|是| N[抛异常'请先完成X站打卡']
      M -->|否| O[自动签出前站]
      O --> P{当前站点已打卡?}
      P -->|是| Q[抛异常'已完成本站打卡']
      P -->|否| R[创建打卡记录]
      R --> S[更新界面数据]
      S --> T[显示成功提示]
      T --> G
      G --> U[设置scanLoading为false]
      
      style A fill:#90EE90,stroke:#333
      style C fill:#FFB6C1,stroke:#333
      style K,N,Q fill:#FFB6C1,stroke:#333
      style T fill:#90EE90,stroke:#333
  ```

  

  

## 功能测试

### 	  测试数据

   - stations: ['起点', '补给站1', '补给站2', '终点'],

   - groups: ['A组', 'B组', 'C组', 'D组'],

   - QR Code:

     ![image-20250401174849059](C:\Users\shahao\AppData\Roaming\Typora\typora-user-images\image-20250401174849059.png)

### 	防跳站测试

- case1:  起点未打卡 --> 打卡其他任意一站（ '补给站1', '补给站2', '终点'）；提示错误并且不会上传数据至数据库

### 	数据统计测试

​		![image-20250401175623873](C:\Users\shahao\AppData\Roaming\Typora\typora-user-images\image-20250401175623873.png)