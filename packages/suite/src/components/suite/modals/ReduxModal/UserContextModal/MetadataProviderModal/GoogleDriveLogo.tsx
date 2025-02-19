type GoogleDriveLogoProps = {
    size: number;
};
export const GoogleDriveLogo = ({ size }: GoogleDriveLogoProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        version="1.0"
        viewBox="0 0 32 32"
        width={size}
        height={size}
    >
        <path fill="#537ABD" d="M31.868 21h-22l-5 9h21.688" />
        <path fill="#2EB672" d="m10.962 2-11 18 5 10 10.721-19.655" />
        <path fill="#FED14B" d="M20.962 2h-10l10.75 19h10.25z" />
    </svg>
);
