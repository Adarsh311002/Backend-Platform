/*
 _id string pk
  name string
  description string
  videos objectId[] videos
  owner objectId users
  createdAt Date
  updatedAt Date
  */

  import mongoose, {Schema} from "mongoose";

  const playlistSchema = new Schema({
    name : {
        type : String,
        require : true
    },
    description : {
        type : String,
        required : true 
    },

    videos : [
        {
        type : Schema.Types.ObjectId,
        ref : "Video"
        },
    ],
      
    owner : {
        type : Schema.Types.ObjectId,
         ref : "User",
         required : true
    }
  },{timestamps : true})

 
  export const Playlist = mongoose.model("Playlist", playlistSchema)

  