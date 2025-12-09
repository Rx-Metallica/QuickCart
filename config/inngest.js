import { Inngest } from "inngest";
import User from "@/models/User";
import Order from "@/models/Order";
import connectDB from "@/config/db";

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
export const createUserOrder = inngest.createFunction(
  {
    id: "create-user-order",
  },
  { event: "order/created" },
  async ({ event }) => {
    // event.data is exactly what you sent from POST
    const { userId, address, items, amount, date } = event.data || {};

    // (Optional) basic guard – but if this passes, Mongoose WILL NOT complain
    if (!userId || !date) {
      throw new Error(
        `Missing userId or date in event.data. Got: ${JSON.stringify(
          event.data
        )}`
      );
    }

    await connectDB();

    const order = await Order.create({
      userId,   // string, required: true
      address,  // string, required: true
      items,    // array, required in your logic
      amount,   // number, required: true
      date,     // number, required: true
    });

    console.log("✅ Order created from Inngest:", order._id);

    return { success: true, orderId: order._id };
  }
);