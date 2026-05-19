import mongoose from 'mongoose';
import config from '../config';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(config.mongodb.uri, {
            family: 4, // Force IPv4
            serverSelectionTimeoutMS: 15000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
