export enum StatusType {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface StatusState {
  type: StatusType;
  message?: string;
}

export enum ActiveTab {
  EXTRACTOR = 'EXTRACTOR',
  ANSWERS = 'ANSWERS',
  TEMPLATE_GENERATOR = 'TEMPLATE_GENERATOR'
}