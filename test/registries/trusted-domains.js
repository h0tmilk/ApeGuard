const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustedDomainRegistry contract", function () {

  let trustedDomain1;
  let trustedDomain2;
  let trustedDomain3;
  let trustedDomain4;
  let trustedDomain5;

  before(async function() {
    this.TrustedDomainsRegistryContract = await ethers.getContractFactory("DomainNamesRegistry");
    trustedDomain1 = "toto.fr";
    trustedDomain2 = "tata.com";
    trustedDomain3 = "titi.io";
    trustedDomain4 = "sub.toto.fr";
    trustedDomain5 = "sub.titi.io";
  });

  beforeEach(async function () {
    [owner, account1] = await ethers.getSigners();

    this.trustedDomainsRegistry = await this.TrustedDomainsRegistryContract.deploy(false);
    await this.trustedDomainsRegistry.deployed();
  });

  describe("Expected use-cases", function () {

    it("Should shouldn't add a trustedDomain with invalid domain name syntax", async function() {
      await expect(this.trustedDomainsRegistry.add("not-a-domain-name")).to.be.revertedWith("invalid domain name");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("bad_domain_name.fr")).to.be.revertedWith("invalid domain name");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("not-a-good-@-name.fr")).to.be.revertedWith("invalid domain name");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("notgud4adomainname..gg")).to.be.revertedWith("invalid domain name");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("-notgud4adomainname.gg")).to.be.revertedWith("invalid domain name");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("this-domain-name-is-so-long-that-it-is-not-a-valid-one-max-is-68.com")).to.be.revertedWith("invalid domain name");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
    });
  });

  describe("Authorizations", function () {
    it("Should allow only owner to add trustedDomain", async function() {
      await expect(
        this.trustedDomainsRegistry.connect(account1).add(trustedDomain1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow only owner to delete trustedDomain", async function() {
      await this.trustedDomainsRegistry.add(trustedDomain1);
      await expect(
        this.trustedDomainsRegistry.connect(account1).remove(trustedDomain1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
