import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    await client.db('ratemyprofessor-db').command({ ping: 1 });
    return NextResponse.json({ status: 'Connected successfully to MongoDB!' });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({ error: 'Failed to connect to MongoDB' }, { status: 500 });
  }
} 