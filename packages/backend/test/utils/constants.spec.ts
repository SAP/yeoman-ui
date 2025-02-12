import { expect } from "chai";
import { isURL } from "../../src/utils/constants"; // Adjust the import path as necessary

describe("constants unit testing", () => {
  describe("isURL unit testing", () => {
    it("should return true when given valid http URL", () => {
      const url = "http://www.example.com";
      const result = isURL(url);
      expect(result).to.be.true;
    });
  });

  it("should return false when given invalid URL", () => {
    const url = "www.example.com";
    const result = isURL(url);
    expect(result).to.be.false;
  });

  it("should return false when given empty string", () => {
    const url = "";
    const result = isURL(url);
    expect(result).to.be.false;
  });
});
