export class ErreurComptoir extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErreurComptoir";
    this.status = status;
  }
}
