// app/api/order/route.js  (or similar)

import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address, items } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "No userId from Clerk" },
        { status: 401 }
      );
    }

    if (!address || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid data" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ Calculate amount safely (no async reduce)
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }
      amount += product.offerPrice * item.quantity;
    }

    const finalAmount = amount + Math.floor(amount * 0.02); // e.g. 2% fee/tax

    const orderData = {
      userId,            // Clerk user id (string)
      address,           // address id or text
      items,             // [{ product, quantity }]
      amount: finalAmount,
      date: Date.now(),  // Number → matches your schema
    };

    const order = await Order.create(orderData);

    // clear user cart
    const user = await User.findById(userId);
    if (user) {
      user.cartItems = {};
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Order Placed",
      orderId: order._id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
