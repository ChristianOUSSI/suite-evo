export class ErreurVoix extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErreurVoix";
    this.status = status;
  }
}
