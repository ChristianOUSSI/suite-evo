export class ErreurPresence extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErreurPresence";
    this.status = status;
  }
}
