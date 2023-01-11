const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens;

describe('RealEstate', () => {
    let realEstate, escrow
    let deployer, seller
    let nftID = 1
    let purchasePrice = ether(100)
    let escrowAmount = ether(20)

    beforeEach(async () => {
        // Set up accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        seller = deployer
        buyer = accounts[1]
        inspector = accounts[2]
        lender = accounts[3]

        // Load contracts
        const RealEstate = await ethers.getContractFactory('RealEstate')
        const Escrow = await ethers.getContractFactory('Escrow')

        // Deploy contracts
        realEstate = await RealEstate.deploy()
        escrow = await Escrow.deploy(
            realEstate.address,
            nftID,
            purchasePrice,
            escrowAmount,
            seller.address,
            buyer.address,
            inspector.address,
            lender.address
        )

        // Seller approved NFT
        transaction = await realEstate.connect(seller).approve(escrow.address, nftID)
        await transaction.wait()

    })

    describe('Deployment', async () => {

        it('sends an NFT to the seller / deployer', async () => {
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address)


        })
    })

    describe('Selling Real Estate', async () => {
        let balance, transaction

        it('executes a successful transaction', async () => {
        // expects seller to be NFT owner before the sale
        expect(await realEstate.ownerOf(nftID)).to.equal(seller.address)

        // Buyer deposits earnest
         transaction = await escrow.connect(buyer).depositEarnest({ value : escrowAmount })
         console.log("Buyer deposits earnest money")

         // Check escrow balance
         balance = await escrow.getBalance()
         console.log("escrow balance:", ethers.utils.formatEther(balance))

         // Inspector updates status
            transaction = await escrow.connect(inspector).updateInspectionStatus(true)
            console.log("Inspector updates status")

         // Buyer approves sale
            transaction = await escrow.connect(buyer).approveSale(true)
            console.log("Buyer approves sale")

         // Seller approves sale
            transaction = await escrow.connect(seller).approveSale(true)
            console.log("Seller approves sale")



         // Lender approves sale
            transaction = await escrow.connect(lender).approveSale(true)
            console.log("Lender approves sale")

        // Lender funds the sale
        transaction = await lender.sendTransaction({ to: escrow.address, value: ether(80) })

        // Finalize the sale
        transaction = await escrow.connect(buyer).finalizeSale()
        await transaction.wait()
        console.log("Buyer finalizes sale")

        // expects buyer to be NFT owner after the sale
        expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address)

        // Expect seller to receive funds
        balance = await ethers.provider.getBalance(sller.address)
        console.log("Seller balance:", ethers.utils.formatEther(balance))
        expect(balance).to.be.above(ether(10099))


        })
    })

})