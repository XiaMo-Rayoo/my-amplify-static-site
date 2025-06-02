// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Amplifyの初期設定
    if (window.aws_exports) {
        awsAmplify.Amplify.configure(window.aws_exports);
        console.log("Amplify has been configured successfully.");
    } else {
        console.error("aws-exports.js is not loaded or configured properly. Ensure it's in the project root and included before this script in your HTML.");
        showMessage("アプリケーション設定エラーです。管理者に連絡してください。", true);
        return; // 設定がない場合は以降の処理を中断
    }

    const Auth = awsAmplify.Auth;

    // --- UI要素への参照 ---
    const messageArea = document.getElementById('messageArea');

    const unauthenticatedLinks = document.getElementById('unauthenticatedLinks');
    const signUpSection = document.getElementById('signUpSection');
    const confirmSignUpSection = document.getElementById('confirmSignUpSection');
    const signInSection = document.getElementById('signInSection');
    const authenticatedSection = document.getElementById('authenticatedSection');

    const signUpForm = document.getElementById('signUpForm');
    const signUpEmailInput = document.getElementById('signUpEmail');
    const signUpPasswordInput = document.getElementById('signUpPassword');

    const confirmSignUpForm = document.getElementById('confirmSignUpForm');
    const confirmEmailInput = document.getElementById('confirmEmail');
    const confirmationCodeInput = document.getElementById('confirmationCode');

    const signInForm = document.getElementById('signInForm');
    const signInEmailInput = document.getElementById('signInEmail');
    const signInPasswordInput = document.getElementById('signInPassword');

    const userEmailDisplay = document.getElementById('userEmail');
    const signOutButton = document.getElementById('signOutButton');

    const showSignUpLink = document.getElementById('showSignUpLink');
    const showSignInLink = document.getElementById('showSignInLink');


    // --- ヘルパー関数 ---
    function showMessage(message, isError = false) {
        if (messageArea) {
            messageArea.textContent = message;
            messageArea.style.color = isError ? '#d9534f' : '#3c763d'; // 赤か緑
            messageArea.style.borderColor = isError ? '#ebccd1' : '#d6e9c6';
            messageArea.style.backgroundColor = isError ? '#f2dede' : '#dff0d8';
            messageArea.style.border = '1px solid';
        }
    }

    function clearMessage() {
        if (messageArea) {
            messageArea.textContent = '';
            messageArea.style.border = '1px solid transparent';
            messageArea.style.backgroundColor = 'transparent';
        }
    }

    function showSection(sectionIdToShow) {
        clearMessage();
        const sections = [signUpSection, confirmSignUpSection, signInSection, authenticatedSection];
        sections.forEach(section => {
            if (section) section.style.display = 'none';
        });

        if (unauthenticatedLinks) unauthenticatedLinks.style.display = 'block';

        let targetSection;
        if (sectionIdToShow === 'signUp') targetSection = signUpSection;
        else if (sectionIdToShow === 'confirmSignUp') targetSection = confirmSignUpSection;
        else if (sectionIdToShow === 'signIn') targetSection = signInSection;
        else if (sectionIdToShow === 'authenticated') {
            targetSection = authenticatedSection;
            if (unauthenticatedLinks) unauthenticatedLinks.style.display = 'none';
        }

        if (targetSection) targetSection.style.display = 'block';
    }

    async function checkAuthState() {
        try {
            const user = await Auth.currentAuthenticatedUser();
            console.log("User is authenticated:", user);
            if (userEmailDisplay) userEmailDisplay.textContent = user.attributes.email;
            showSection('authenticated');
        } catch (error) {
            console.log("User is not authenticated:", error);
            if (userEmailDisplay) userEmailDisplay.textContent = '';
            showSection('signIn'); // デフォルトはサインイン画面
        }
    }

    // --- イベントリスナー ---
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = signUpEmailInput.value;
            const password = signUpPasswordInput.value;
            showMessage('アカウント登録処理中...', false);
            try {
                await Auth.signUp({
                    username: email,
                    password: password,
                    attributes: { email: email }
                });
                showMessage(`確認コードを ${email} に送信しました。コードを入力してアカウントを有効化してください。`, false);
                confirmEmailInput.value = email; // 確認フォームにEメールを事前入力
                showSection('confirmSignUp');
            } catch (error) {
                console.error('Error signing up:', error);
                showMessage(`サインアップエラー: ${error.message}`, true);
            }
        });
    }

    if (confirmSignUpForm) {
        confirmSignUpForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = confirmEmailInput.value;
            const code = confirmationCodeInput.value;
            showMessage('アカウント確認処理中...', false);
            try {
                await Auth.confirmSignUp(email, code);
                showMessage('アカウントの確認が完了しました。サインインしてください。', false);
                signInEmailInput.value = email; // サインインフォームにEメールを事前入力
                showSection('signIn');
            } catch (error) {
                console.error('Error confirming sign up:', error);
                showMessage(`アカウント確認エラー: ${error.message}`, true);
            }
        });
    }

    if (signInForm) {
        signInForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = signInEmailInput.value;
            const password = signInPasswordInput.value;
            showMessage('サインイン処理中...', false);
            try {
                const user = await Auth.signIn(email, password);
                console.log('Sign in successful:', user);
                showMessage('サインインしました！', false);
                await checkAuthState(); // 認証状態を更新してUIを切り替え
            } catch (error) {
                console.error('Error signing in:', error);
                if (error.code === 'UserNotConfirmedException') {
                    showMessage('アカウントがまだ確認されていません。確認コードを入力してください。', true);
                    confirmEmailInput.value = email; // 確認フォームにEメールを事前入力
                    showSection('confirmSignUp');
                } else {
                    showMessage(`サインインエラー: ${error.message}`, true);
                }
            }
        });
    }

    if (signOutButton) {
        signOutButton.addEventListener('click', async () => {
            showMessage('サインアウト処理中...', false);
            try {
                await Auth.signOut(); // グローバルサインアウト
                console.log('Sign out successful');
                showMessage('サインアウトしました。', false);
                await checkAuthState(); // UIを未認証状態に更新
            } catch (error) {
                console.error('Error signing out:', error);
                showMessage(`サインアウトエラー: ${error.message}`, true);
            }
        });
    }

    if (showSignUpLink) {
        showSignUpLink.addEventListener('click', (event) => {
            event.preventDefault();
            showSection('signUp');
        });
    }

    if (showSignInLink) {
        showSignInLink.addEventListener('click', (event) => {
            event.preventDefault();
            showSection('signIn');
        });
    }

    // --- 初期化処理 ---
    checkAuthState(); // ページ読み込み時に認証状態を確認し、適切なUIを表示
});
