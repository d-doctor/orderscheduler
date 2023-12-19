export interface GoogCal {
  kind: string;
  etag: string;
  accessRole: string;
  colorId: string;

  id: string;
  summary: string;
}

export interface GoogCalEvent {
  kind: string;
  etag: string;
  accessRole: string;
  colorId: string;

  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}
