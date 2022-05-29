const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustedDomainRegistry contract", function () {

  let trustedDomain1;
  let trustedDomain2;
  let trustedDomain3;
  let trustedDomain4;
  let trustedDomain5;

  before(async function() {
    this.TrustedDomainsRegistryContract = await ethers.getContractFactory("TrustedDomainsRegistry");
    trustedDomain1 = "toto.fr";
    trustedDomain2 = "tata.com";
    trustedDomain3 = "titi.io";
    trustedDomain4 = "sub.toto.fr";
    trustedDomain5 = "sub.titi.io";
  });

  beforeEach(async function () {
    [owner, account1] = await ethers.getSigners();

    this.trustedDomainsRegistry = await this.TrustedDomainsRegistryContract.deploy();
    await this.trustedDomainsRegistry.deployed();
  });

  describe("Expected use-cases", function () {
    it("Should have 0 trustedDomains after deployment", async function() {
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
    });

    it("Should not contain trustedDomain1", async function() {
      expect(await this.trustedDomainsRegistry.contains(trustedDomain1)).to.be.false;
    });

    it("Should add 2 trustedDomains", async function() {
      await this.trustedDomainsRegistry.add(trustedDomain1);
      expect(await this.trustedDomainsRegistry.contains(trustedDomain1)).to.be.true;
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('1');

      await this.trustedDomainsRegistry.add(trustedDomain2);
      expect(await this.trustedDomainsRegistry.contains(trustedDomain2)).to.be.true;
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('2');
    });

    it("Should shouldn't add a trustedDomain with same name (case insensitive)", async function() {
      await this.trustedDomainsRegistry.add(trustedDomain1);
      expect(await this.trustedDomainsRegistry.contains(trustedDomain1)).to.be.true;
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('1');

      await expect(this.trustedDomainsRegistry.add("tOtO.fr")).to.be.revertedWith("trustedDomainName (case insensitive) already in map");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('1');
    });

    it("Should shouldn't add a trustedDomain with invalid domain name syntax", async function() {
      await expect(this.trustedDomainsRegistry.add("not-a-domain-name")).to.be.revertedWith("invalid domain name - unallowed character");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("bad_domain_name.fr")).to.be.revertedWith("invalid domain name - unallowed character");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("not-a-good-@-name.fr")).to.be.revertedWith("invalid domain name - unallowed character");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("notgud4adomainname..gg")).to.be.revertedWith("invalid domain name - unallowed character");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
      await expect(this.trustedDomainsRegistry.add("-notgud4adomainname.gg")).to.be.revertedWith("invalid domain name - unallowed character");
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('0');
    });

    it("Should should return true when containing trustedDomain (case insensitive)", async function() {
      await this.trustedDomainsRegistry.add(trustedDomain1);
      expect(await this.trustedDomainsRegistry.contains("toto.fr")).to.be.true;
      expect(await this.trustedDomainsRegistry.contains("tOto.fr")).to.be.true;
      expect(await this.trustedDomainsRegistry.contains("toTo.Fr")).to.be.true;
    });

    it("Should remove 2 trustedDomains", async function() {
      await this.trustedDomainsRegistry.add(trustedDomain1);
      await this.trustedDomainsRegistry.add(trustedDomain2);
      await this.trustedDomainsRegistry.add(trustedDomain3);
      await this.trustedDomainsRegistry.add(trustedDomain4);

      await this.trustedDomainsRegistry.remove(trustedDomain3);
      await this.trustedDomainsRegistry.remove(trustedDomain1);

      expect(await this.trustedDomainsRegistry.contains(trustedDomain3)).to.be.false;
      expect(await this.trustedDomainsRegistry.contains(trustedDomain1)).to.be.false;
      expect((await this.trustedDomainsRegistry.size()).toString()).to.equal('2');
    });

    it("Should not allow to remove unexisting trustedDomain", async function() {
      await expect(this.trustedDomainsRegistry.remove(trustedDomain1)).to.be.revertedWith("trustedDomainName (case insensitive) must be present in map");
    });

    it("Should match mapping indexes with list indexes", async function() {
      // Add trustedDomains
      await this.trustedDomainsRegistry.add(trustedDomain1);
      await this.trustedDomainsRegistry.add(trustedDomain2);
      await this.trustedDomainsRegistry.add(trustedDomain3);
      await this.trustedDomainsRegistry.add(trustedDomain4);

      let trustedDomain1AddressMappingIndex;
      let trustedDomain2AddressMappingIndex;
      let trustedDomain3AddressMappingIndex;
      let trustedDomain4AddressMappingIndex;

      // Get registered indexes in mapping for each address
      trustedDomain1AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain1);
      trustedDomain2AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain2);
      trustedDomain3AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain3);
      trustedDomain4AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain4);

      // Get from the list the address stored at the mapping stored index
      let trustedDomain1ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain1AddressMappingIndex);
      let trustedDomain2ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain2AddressMappingIndex);
      let trustedDomain3ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain3AddressMappingIndex);
      let trustedDomain4ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain4AddressMappingIndex);

      // Chexk if addresses are matching between list an mapping
      expect(trustedDomain1ListIndex.toString()).to.be.equal(trustedDomain1.toString());
      expect(trustedDomain2ListIndex.toString()).to.be.equal(trustedDomain2.toString());
      expect(trustedDomain3ListIndex.toString()).to.be.equal(trustedDomain3.toString());
      expect(trustedDomain4ListIndex.toString()).to.be.equal(trustedDomain4.toString());

      // Remove some trustedDomain
      await this.trustedDomainsRegistry.remove(trustedDomain3);
      await this.trustedDomainsRegistry.remove(trustedDomain1);

      // Same tests again
      trustedDomain2AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain2);
      trustedDomain4AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain4);
      trustedDomain2ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain2AddressMappingIndex);
      trustedDomain4ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain4AddressMappingIndex);
      expect(trustedDomain2ListIndex.toString()).to.be.equal(trustedDomain2.toString());
      expect(trustedDomain4ListIndex.toString()).to.be.equal(trustedDomain4.toString());

      // Add a new trustedDomain and add previously removed trustedDomain3 again
      await this.trustedDomainsRegistry.add(trustedDomain5);
      await this.trustedDomainsRegistry.add(trustedDomain3);

      let trustedDomain5AddressMappingIndex;

      // Same tests
      trustedDomain3AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain3);
      trustedDomain5AddressMappingIndex = await this.trustedDomainsRegistry.getTrustedDomainId(trustedDomain5);
      trustedDomain3ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain3AddressMappingIndex);
      trustedDomain5ListIndex = await this.trustedDomainsRegistry.getByIndex(trustedDomain5AddressMappingIndex);

      expect(trustedDomain3ListIndex.toString()).to.be.equal(trustedDomain3.toString());
      expect(trustedDomain5ListIndex.toString()).to.be.equal(trustedDomain5.toString());
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
