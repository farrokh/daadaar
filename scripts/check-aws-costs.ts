
import { $ } from "bun";

async function checkVpcEndpoints() {
  console.log("🔍 Checking VPC Endpoint Cost Configuration...");
  
  try {
    const output = await $`aws ec2 describe-vpc-endpoints --query "VpcEndpoints[*].{ID:VpcEndpointId, Service:ServiceName, SubnetCount:length(SubnetIds), Subnets:SubnetIds}" --output json`.text();
    const endpoints = JSON.parse(output);
    
    let hasIssues = false;
    
    for (const ep of endpoints) {
      // Gateway endpoints (S3, DynamoDB) don't have subnets/eni costs usually in the same way, but Interface ones do.
      // S3 is usually Gateway, others Interface.
      if (ep.Service.includes("s3") && ep.SubnetCount === 0) continue; // S3 Gateway
      
      if (ep.SubnetCount > 2) {
        console.error(`❌ [HIGH COST WARNING] Endpoint ${ep.ID} (${ep.Service}) is in ${ep.SubnetCount} AZs!`);
        console.error(`   - This costs ~$${(ep.SubnetCount * 0.01 * 24).toFixed(2)}/day.`);
        console.error(`   - Recommended: Reduce to 1-2 AZs.`);
        hasIssues = true;
      } else {
        console.log(`✅ ${ep.Service}: Optimized (${ep.SubnetCount} AZs)`);
      }
    }
    
    if (!hasIssues) {
      console.log("\n✨ All VPC Endpoints are cost-optimized.");
    }
    
  } catch (error) {
    console.error("Error running AWS command:", error);
  }
}

await checkVpcEndpoints();
