# This is a sample Python script.

import qrcode
import os
import time
def get_qr_code_image(source: str, data: str) -> None:
    """
    生成二维码
    :param source: 保存路径
    :param data: 数据
    :return:
    """
    if not os.path.exists(source):
        os.makedirs(source)
    qr = qrcode.QRCode(
        version=2,  # 尺寸
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # 容错信息当前为 30% 容错
        box_size=10,  # 每个格子的像素大小
        border=4  # 边框格子宽度
    )  # 设置二维码的大小
    try:
        qr.add_data(data)
        # 生成二维码图片，fill_color二维码颜色，back_color二维码背景颜色
        img = qr.make_image(fill_color='green', back_color="white")
        # 用时间戳命名文件
        #filename = str(time.time()).split('.')[0] + '.png'
        filename = data + '.png'
        file = os.path.join(source, filename)
        img.save(file)
        print(f"二维码{filename}生成成功")
    except Exception as e:
        print(f"生成失败：{e}")


if __name__ == '__main__':
    source_path = r'code_img'
    data = '12332'
    get_qr_code_image(source_path, data)

