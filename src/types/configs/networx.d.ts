export interface NetWorxData {
  id: string;
  title: string;
  type: string;
  content?: JSX.Element | string;
  children?: NetWorxData[];
}
