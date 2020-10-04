FROM node

COPY . /home/workspace

WORKDIR /home/workspace

EXPOSE 3001

CMD [ "npm", "start" ]