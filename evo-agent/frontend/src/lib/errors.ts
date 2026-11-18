export class ErreurAgent extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErreurAgent";
    this.status = status;
  }
}
