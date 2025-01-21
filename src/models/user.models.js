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
  import bcrypt from "bcrypt";
  import jwt from "jsonwebtoken";


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

userSchema.pre("save", async function (next){

    if(!this.isModified("password")) return next();

        // console.log("Original Password:", this.password); // plain text password

    this.password = await bcrypt.hash(this.password,10)

    // console.log("Hashed Password:", this.password); // hashed password

    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    // console.log("Provided Password:", password); 
    // console.log("Stored Hashed Password:", this.password);
    return await bcrypt.compare(String(password), String(this.password))
}

userSchema.methods.generateAccessToken = function(){
    //short lived access token

    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    }, process.env.ACCESS_TOKEN_SECRET,
{expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
);
}

userSchema.methods.generateRefreshToken = function() {
    //long lived refresh token
    return jwt.sign({
        _id : this._id,

    },process.env.REFRESH_TOKEN_SECRET,
    {expiresIn : process.env.REFRESH_TOKEN_EXPIRY})
}

export const User = mongoose.model("User", userSchema)

