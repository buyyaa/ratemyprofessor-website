import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, action } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('ratemyprofessor-db');
    const users = db.collection('users');

    let result;
    
    switch (action) {
      case 'register': {
        result = await users.findOneAndUpdate(
          { email },
          { 
            $setOnInsert: { 
              email,
              tokens: 20,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          { 
            upsert: true,
            returnDocument: 'after'
          }
        );
        return NextResponse.json({ success: true, tokens: result.value.tokens });
      }

      case 'get': {
        const user = await users.findOne({ email });
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ tokens: user.tokens });
      }

      case 'update': {
        const { amount } = await request.json();
        result = await users.findOneAndUpdate(
          { email },
          { 
            $inc: { tokens: amount },
            $set: { updatedAt: new Date() }
          },
          { returnDocument: 'after' }
        );
        return NextResponse.json({ tokens: result.value.tokens });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 