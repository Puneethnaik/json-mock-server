FROM node

COPY . /home/workspace

WORKDIR /home/workspace

EXPOSE 8080

CMD [ "npm", "start" ]