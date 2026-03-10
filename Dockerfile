FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY index.html script.js style.css corredoradf.png /usr/share/nginx/html/
EXPOSE 80
