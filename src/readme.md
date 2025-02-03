
# Platform

Platform is a backend app in which I have made multiple controllers for different usages which can be integrated to any projects with little tweaks.


## Database Design

![Schema]![Image](https://github.com/user-attachments/assets/bd71abb8-89eb-42a0-805d-3f219e717024)


## API Reference

#### To timely check the Server Status

```http
  GET api/v1/healthcheck
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Required**.  |

#### Register route

```http
  POST /api/v1/users/register
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `username`      | `string` | **Required** |
| `email`      | `string` | **Required** |
| `password`      | `string` | **Required** |
| `fullname`      | `string` | **Required** |

### Login route

```http
POST /api/v1/users/login
```
| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `username`      | `string` | **Required** |
| `email`      | `string` | **Required** |
| `password`      | `string` | **Required** |

#### Change Password

```http
  POST /api/v1/users/change-password
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `OldPassword`      | `string` | **Required** |
| `NewPassword`      | `string` | **Required** |


#### To update the Account details

```http
    POST /v1/users/update-account
```

| Parameter | Type     | Description (Available after Authorization)                      |
| :-------- | :------- | :-------------------------------- |
| `fullname`      | `string` | Required if you want to update this |
| `email`      | `string` | Required if you want  to update this |

### To get the refresh-token

```http
 GET /api/v1/users/refresh-token
```
### To check current user

```http
 GET /api/v1/users/current-user
 ```

### Get user channel profile

```http
 GET /api/v1/users/c/username
 ```

 
### Update user Avatar

```http
 PATCH /api/v1/users/avatar
 ```
 In Form Data 

 (avatar : File)

 
### Check the Watch History

```http
 GET /api/v1/users/history
 ```

### Logout

```http
GET /api/v1/users/logout
```



 


## Installation

Install my-project with npm

server side

```bash
  npm install 
  connect you Mongo_URI
  npm run start/npm run dev(for nodemon)
```

## Tech Stack



**Server:** Node, Express , JsonWebToken , Multer for file handling

**Database:** MongoDB,Clodinary


## Appendix


Zod for validation,  jwt token for authentication,   bcrypt for password hashing, moongose as ORM are used , multer for file handling 



