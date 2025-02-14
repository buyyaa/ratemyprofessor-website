import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

export async function connectToDatabase() {
    const client = await clientPromise;
    const db = client.db();
    return { db, client };
} 