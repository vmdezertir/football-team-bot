export type CastProperty<SOURCE, PROPERTY, TYPE> = {
  [K in keyof SOURCE]: K extends PROPERTY ? TYPE : SOURCE[K];
};
