type DropboxLogoProps = {
    size: number;
};

export const DropboxLogo = ({ size }: DropboxLogoProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        fill="#2484E3"
        viewBox="0 0 512 512"
        width={size}
        height={size}
    >
        <path d="m29.9 280.2 132.4 86.4 92.6-77.3-133.4-82.4zM162.3 47.3 29.9 133.7l91.6 73.2 133.4-82.3zm317.6 86.4L347.6 47.3l-92.7 77.3 133.5 82.3zm-225 155.6 92.7 77.3 132.3-86.4-91.5-73.3z" />
        <path d="M255.2 305.9 162.3 383l-39.8-26v29.1l132.7 79.5 132.6-79.5V357l-39.7 26z" />
    </svg>
);
