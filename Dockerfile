# 使用一个轻量级的Nginx镜像作为基础镜像
FROM nginx:alpine

# 将本地的HTML和CSS文件复制到Nginx的默认静态文件目录
COPY . /usr/share/nginx/html

# 暴露80端口，这是Nginx默认监听的端口
EXPOSE 80

# 启动Nginx服务器
CMD ["nginx", "-g", "daemon off;"]