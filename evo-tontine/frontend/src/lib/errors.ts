export class ErreurCercle extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErreurCercle";
    this.status = status;
  }
}
