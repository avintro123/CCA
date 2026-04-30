import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  captainId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['PENDING_PAYMENT', 'APPROVED', 'REJECTED'],
    default: 'PENDING_PAYMENT',
  })
  status: string;

  @Prop([
    {
      name: { type: String, required: true },
      role: {
        type: String,
        enum: ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'],
        default: 'BATSMAN',
      },
      isCaptain: { type: Boolean, default: false },
    },
  ])
  players: any[];
}

export const TeamSchema = SchemaFactory.createForClass(Team);
