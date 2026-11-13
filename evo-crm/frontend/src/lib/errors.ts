export class ErreurCarnet extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErreurCarnet";
    this.status = status;
  }
}
