import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getMaxPriorityFeePerGas } from "../utils/callRpc";

 
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, ethers, getNamedAccounts, network } = hre;
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.getSigner(deployer);

    let maxPriorityFeePerGas = ethers.BigNumber.from(Math.ceil(parseInt(await getMaxPriorityFeePerGas(network.name)) * 1.25));
    console.log(`now ${network.name} maxPriorityFeePerGas is: ${maxPriorityFeePerGas}`);

    // deploy ProxyAdmin contract
    const ProxyAdminResult = await deployments.deploy("ProxyAdmin", {
        from: deployer,
        args: [],
    });
    console.log(`ProxyAdmin contract address: ${ProxyAdminResult.address}`);

    // deploy MasterChef contract
    const MasterChefResult = await deployments.deploy("MasterChef", {
        from: deployer,
        args: [],
        maxPriorityFeePerGas,
    });
    console.log(`MasterChef contract address: ${MasterChefResult.address}`);
    // get ProxyAdmin contract
    const ProxyAdminDeployment = await deployments.get("ProxyAdmin");
    // deploy Proxy contract
    const ProxyResult = await deployments.deploy("MasterChefProxy", {
        from: deployer,
        args: [MasterChefResult.address, ProxyAdminDeployment.address, "0x"],
        contract: "TransparentUpgradeableProxy",
        maxPriorityFeePerGas,
    });
    console.log(`Proxy contract address: ${ProxyResult.address}`);
    const MasterChef = await ethers.getContractAt("MasterChef", ProxyResult.address, signer);
    const rewardToken = "0x34FAccef0cc9e9f4e87Db5c294a9E00B2b825B0d";
    const rewardPerBlock = 288000000000;
    const startBlock = 358731;
    const initializeTx = await MasterChef.initialize( rewardToken, rewardPerBlock, startBlock, { maxPriorityFeePerGas });
    await initializeTx.wait();
    console.log('MasterChef contract initilize successfully.');
}

export default func;
func.tags = ["MasterChef"];