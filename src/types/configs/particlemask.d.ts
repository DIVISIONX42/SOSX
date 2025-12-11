export interface ParticlesMask {
  id: string;
  title: string;
  type: string;
  content?: JSX.Element | string;
  children?: ParticlesMask[];
}
