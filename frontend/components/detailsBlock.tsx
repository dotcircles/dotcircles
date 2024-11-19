const RoscaInfo = ({
  name,
  type,
  start,
  contributionAmount,
  contributionFrequency,
  totalParticipants,
  minParticipants,
}: any) => {
  return (
    <div className="max-w-fit mx-auto bg-default bg-opacity-30 shadow-md rounded-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Saving Circle Information
        </h2>
        <div className="space-y-4">
          <InfoRow label="Name" value={name} />
          <InfoRow label="Type" value={type} />
          <InfoRow label="Start By Block" value={start} />
          <InfoRow label="Contribution Amount" value={contributionAmount} />
          <InfoRow
            label="Contribution Frequency"
            value={contributionFrequency}
          />
          <InfoRow
            label="Total Number Of Participants"
            value={totalParticipants}
          />
          <InfoRow label="Min Participants" value={minParticipants} />
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: any) => (
  <div className="flex justify-between">
    <span className="font-semibold mr-4">{label}:</span>
    <span className="">{value}</span>
  </div>
);

export default RoscaInfo;
