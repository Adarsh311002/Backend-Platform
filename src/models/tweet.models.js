/*
 _id string pk
  owner objectId users
  content string
  createdAt Date
  updatedAt Date
  */

  import mongoose, {Schema} from "mongoose";

  const tweetSchema = new Schema({
    owner : {
        type : Schema.Types.ObjectId,
        ref: "User",
        required : true
    },
    content : {
        type : String,
        required : true
    }
  },{timestamps : true})


  export const Tweet = mongoose.model("Tweet",  tweetSchema)
  