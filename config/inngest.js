import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";

export const inngest = new Inngest({id: "quickcart-next"});


// Inngest Function to save user data to a database
export const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk'
    },
    {event: 'clerk/user.created'},
    async({event})=> {
        const {id,first_name,last_name,email_addresses,image_url} = event.data;
        const userData = {
            _id: id,
            name: first_name + " " + last_name,
            email: email_addresses[0].email_address,
            imageUrl: image_url,
        }
        await connectDB();
        await User.create(userData)
    }
)

// Inngest Function to update user data to a database
export const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk'
    },
    {event: 'clerk/user.updated'},
    async({event})=> {
        const {id,first_name,last_name,email_addresses,image_url} = event.data; 
        const userData = {
            _id: id,
            name: first_name + " " + last_name,
            email: email_addresses[0].email_address,
            imageUrl: image_url,
        }
        await connectDB();
        await User.findByIdAndUpdate(id, userData)
    }
)

// Inngest Function to delete user data from a database
export const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-from-clerk'
    },
    {event: 'clerk/user.deleted'},
    async({event})=> {
        const {id} = event.data; 
        await connectDB();
        await User.findByIdAndDelete(id)
    }   
)

// Ingest Function to create users order in database
export const createOrder = inngest.createFunction(
    {
        id: 'create-user-order',
        batchEvents:{
            maxSize: 25,
            timeout: '5s' // 5 s
        }
    },
    {event: 'order/created'},
    async({events})=>{
        const orders = events.map((event)=>{
            return{
                userid: event.data.userId,
                address: event.data.address,
                items: event.data.items,
                amount: event.data.amount,
                data: event.data.data
            }
        })

        await connectDB();
        await Order.insertMany(orders);

        return {success: true, processed: orders.length};
    }
)