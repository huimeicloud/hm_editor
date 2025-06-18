# 主构建Dockerfile - 基于自定义基础镜像
# 使用我们的基础镜像
FROM hmeditor/node_wkhtmltox:14.18.3 AS builder

# 最后复制经常变动的 ckeditor 文件
COPY dev/builder/release/ckeditor/ .

EXPOSE 3071
CMD [ "node", "./index.js" ]