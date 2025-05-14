// RankSelector.tsx
import React from 'react';

type RankSelectorProps = {
  selectedRankCategory: string;
  selectedRank: string;
  onRankCategoryChange: (category: string) => void;
  onRankChange: (rank: string) => void;
};

const RankSelector: React.FC<RankSelectorProps> = ({
  selectedRankCategory,
  selectedRank,
  onRankCategoryChange,
  onRankChange,
}) => {
  const officerRanks = [
    { value: "O1", label: "O-1 (ENS)" },
    { value: "O2", label: "O-2 (LTJG)" },
    { value: "O3", label: "O-3 (LT)" },
    { value: "O4", label: "O-4 (LCDR)" },
    { value: "O5", label: "O-5 (CDR)" },
    { value: "O6", label: "O-6 (CAPT)" },
    { value: "W2", label: "W-2 (CWO2)" },
    { value: "W3", label: "W-3 (CWO3)" },
    { value: "W4", label: "W-4 (CWO4)" },
  ];

  const enlistedRanks = [
    { value: "E4", label: "E-4 (PO3)" },
    { value: "E5", label: "E-5 (PO2)" },
    { value: "E6", label: "E-6 (PO1)" },
    { value: "E7", label: "E-7 (CPO)" },
    { value: "E8", label: "E-8 (SCPO)" },
  ];

  return (
    <div className="mb-4 p-4 bg-card rounded border-none">
      <h3 className="text-xl font-medium mb-2">Select Your Rank</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-foreground mb-1">
            Category
          </label>
          <select
            value={selectedRankCategory}
            onChange={(e) => onRankCategoryChange(e.target.value)}
            className="w-full p-2 border border-ring bg-background rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Officer">Officer</option>
            <option value="Enlisted">Enlisted</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Grade
          </label>
          <select
            value={selectedRank}
            onChange={(e) => onRankChange(e.target.value)}
            className="w-full p-2 border border-ring bg-background rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {selectedRankCategory === 'Officer'
              ? officerRanks.map((rank) => (
                  <option key={rank.value} value={rank.value}>
                    {rank.label}
                  </option>
                ))
              : enlistedRanks.map((rank) => (
                  <option key={rank.value} value={rank.value}>
                    {rank.label}
                  </option>
                ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default RankSelector;
