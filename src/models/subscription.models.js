/*
_id string pk
  subscription objectId users
  channel objectId users
  createdAt Date
  updatedAt Date
*/

import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscription : {
        type : Schema.Types.ObjectId,
        ref: "User"
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps : true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)