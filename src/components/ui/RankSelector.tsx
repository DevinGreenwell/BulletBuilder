// RankSelector.tsx - COMPRESSED VERSION
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
    <div className="p-2 bg-card rounded border-none"> {/* COMPRESSED: Removed mb-4, reduced padding from p-4 to p-2 */}
      <h3 className="text-lg font-medium mb-2">Select Your Rank</h3> {/* COMPRESSED: Reduced from text-xl to text-lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3"> {/* COMPRESSED: Reduced gap from gap-4 to gap-3 */}
        <div>
          <label className="block text-xs font-medium text-primary-foreground mb-1"> {/* COMPRESSED: Reduced from text-sm to text-xs */}
            Category
          </label>
          <select
            value={selectedRankCategory}
            onChange={(e) => onRankCategoryChange(e.target.value)}
            className="w-full p-1.5 border border-ring bg-background rounded text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500" // COMPRESSED: Reduced padding from p-2 to p-1.5, added text-sm
          >
            <option value="Officer">Officer</option>
            <option value="Enlisted">Enlisted</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1"> {/* COMPRESSED: Reduced from text-sm to text-xs */}
            Grade
          </label>
          <select
            value={selectedRank}
            onChange={(e) => onRankChange(e.target.value)}
            className="w-full p-1.5 border border-ring bg-background rounded text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500" // COMPRESSED: Reduced padding from p-2 to p-1.5, added text-sm
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