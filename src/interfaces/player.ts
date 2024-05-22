export enum EPlayerPosition {
  Goalkeeper = 'Goalkeeper',
  Defender = 'Defender',
  Midfielder = 'Midfielder',
  Attacker = 'Attacker',
}

export interface IPlayer {
  id: number;
  name: string;
  age: number;
  number: number;
  position: EPlayerPosition;
  photo: string;
}

export type ISquad = {
  [key in EPlayerPosition]: IPlayer[];
};

export interface IPlayerInjure {
  id: number;
  name: string;
  photo: string;
  type: string;
  reason: string;
}
