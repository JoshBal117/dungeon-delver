export type Resource = { current: number;  max: number };


export type StatBlock = {
  hp: Resource;
  mp: Resource;                    // or stamina later
  str: number;                     // physical power
  dex: number;                     // accuracy/speed scaler (future)
  int: number;                     // magic power (future)
  armor: number;                   // flat mitigation for physical
  resist: number;                  // flat mitigation for magic
  speed: number;                   // turn order

};

export type Actor = {
    id: string;
    name: string;
    isPlayer: boolean;
    stats: StatBlock;   
    
};

export type LogEvent = {text: string};

export type CombatState = {
    turn :number;
    order: string[];
    actors: Record<string, Actor>;
    log: LogEvent[];
    over: boolean;

};