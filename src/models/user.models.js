/*
  _id string pk
  watchhistory objectId[] videos
  username string
  email string
  fullname string
  avatar string
  password hashed
  refreshtoken string
  createdAt Date
  updatedAt Date
  */

  import mongoose, {Schema} from "mongoose";


  const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },

    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },

    fullname : {
        type : String,
        required  : true,
        trim : true,
        index : true
    },

    avatar : {
        type : String, // url string from cloudinary
        required : true,

    },

    coverImage : {
        type : String,
        required : false
    },

    watchHistory : [
        {
            type : Schema.Types.ObjectId, 
            ref : "Video"
        }
    ],

    password : {
        type : String,
        required : [true, "password is required"]
    },

    refreshToken : {
        type : String,
    }
  },
  {timestamps : true}
)

export const User = mongoose.model("User", userSchema)

