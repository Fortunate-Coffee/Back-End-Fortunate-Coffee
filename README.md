# Analysis and Development of a Website-based Food Ordering System to Support the Operations of Loving Nature Fortunate Coffee in Medan

This is The Final Project for Loving Nature Fortunate Coffee in Medan by Creating The Website-based Food ordering using Express.JS and PostGreSQL

## 🛠️ The Result Preview

![image](https://ik.imagekit.io/fndsjy/Fortunate_Coffee/API.png?updatedAt=1723784871790)

## 🛠️ Tech Stack & Tools Information

- Express.JS
- PostGreSQL
- OOP JavaScript

## 🛠️ Getting Started in Local

First, install the library on your VSCode terminal :
```bash
yarn install or yarn
```

Adjust to your PostgreSQL environment on :
```bash
back-end > config > database.js
```

Delete database to make sure don't have it yet, then create database yarn, create migration, and create seeders

```bash
yarn db:setup
```
or
```bash
yarn db:drop && yarn db:create && yarn db:migrate && yarn db:seed
```

Run the development server :

```bash
yarn start
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see API is running.

You can start editing the page by modifying `app\controllers`. You can check the result on Postman.