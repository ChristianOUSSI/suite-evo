export class ErreurChantier extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErreurChantier";
    this.status = status;
  }
}
