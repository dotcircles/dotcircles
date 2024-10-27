export default function CreateToast({
  name,
  contributionAmount,
  contributionFrequency,
  randomOrder,
}: any) {
  return (
    <div className="flex flex-col">
      <span>
        <strong>Name: </strong>
        <span>{name}</span>
      </span>
      <span>
        <strong>Contribution Amount: </strong>
        <span>{contributionAmount}</span>
      </span>
      <span>
        <strong>Contribution Frequency: </strong>
        <span>{contributionFrequency}</span>
      </span>
      <span>
        <strong>Random Order: </strong>
        <span>{randomOrder}</span>
      </span>
    </div>
  );
}
