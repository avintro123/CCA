import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  CAPTAIN = 'captain',
  FAN = 'fan',
  SCORER = 'scorer',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  googleId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop({ enum: UserRole, default: UserRole.FAN })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
